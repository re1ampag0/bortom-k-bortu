"""Offline WebP2x bank, content deduplication and usage-cohort atlases. No runtime compressor."""
from PIL import Image
from pathlib import Path
from collections import defaultdict
import hashlib,json,math
bank=Path('src/ui/game/scene-window/art');bank.mkdir(exist_ok=True)
families=[Path('src/ui/menus'),Path('src/ui/game/ship-window'),Path('src/ui/game/weather-window')]
memo={};originals={};assets={};usage=defaultdict(set);refs=[];stats={};documents={}
def save(im):
 import io
 key=hashlib.sha256(im.tobytes()+str(im.size).encode()).hexdigest()
 if key in memo:return memo[key]
 b=io.BytesIO();im.save(b,format='WEBP',quality=92,method=4,exact=True);data=b.getvalue();name='art-'+hashlib.sha256(data).hexdigest()[:20]+'.webp';(bank/name).write_bytes(data);memo[key]=name;return name
def visit(nodes):
 for n in nodes:
  yield n
  yield from visit(n.get('children',[]))
for folder in families:
 old=folder/'aliases.json';aliases=json.loads(old.read_text())if old.exists()else{}
 docs=json.loads((folder/'scenes.json').read_text());documents[folder]=docs
 logical={}
 for scene in docs.values():
  for node in visit(scene['tree']):
   for a in ([node['art']]if node.get('art')else[])+node.get('frames',[]):logical[a['src']]=(a['w'],a['h'])
  for feature in scene.get('features',[]):
   for a in feature['frames']:logical[a['src']]=(a['w'],a['h'])
 for path in (folder/'art').glob('*'):
  if path.suffix.lower() not in ['.png','.svg']:continue
  if path.suffix=='.svg':
   raw=path.read_bytes();name='art-'+hashlib.sha256(raw).hexdigest()[:20]+'.svg';(bank/name).write_bytes(raw);aliases[path.name]=name;continue
  rawhash=hashlib.sha256(path.read_bytes()).hexdigest()
  if rawhash in originals:
   name=originals[rawhash];aliases[path.name]=name;continue
  im=Image.open(path).convert('RGBA');size=logical.get(path.name,(im.width/3,im.height/3));im=im.resize((max(1,round(size[0]*2)),max(1,round(size[1]*2))),Image.Resampling.LANCZOS)
  name=save(im);aliases[path.name]=name;assets[name]=im;originals[rawhash]=name
 (folder/'aliases.json').write_text(json.dumps(aliases,separators=(',',':')))
 for scene,doc in docs.items():
  for n in visit(doc['tree']):
   if n.get('image'):n['image']=aliases.get(n['image'],n['image'])
   for art in ([n['art']]if n.get('art')else[])+n.get('frames',[]):
    src=aliases.get(art['src'],art['src']);art['src']=src
    if src in assets and assets[src].width<=700 and assets[src].height<=512:
     usage[src].add(str(folder)+':'+scene);refs.append(art)
  for feature in doc.get('features',[]):
   for a in feature['frames']:a['src']=aliases.get(a['src'],a['src'])
 # Still images and backgrounds also resolve through the shared content bank.
for group in sorted(set(tuple(sorted(v))for v in usage.values())):
 names=sorted([n for n,v in usage.items()if tuple(sorted(v))==group],key=lambda n:(-assets[n].height,n));pages=[];positions={};im=Image.new('RGBA',(2048,2048));x=y=row=0;used=[]
 def flush():
  global im,x,y,row,used
  if not used:return
  atlas=im.crop((0,0,2048,y+row+2));name=save(atlas)
  for src,sx,sy,w,h in used:positions[src]=(name,[sx,sy,w,h,atlas.width,atlas.height])
  im=Image.new('RGBA',(2048,2048));x=y=row=0;used=[]
 for src in names:
  a=assets[src];w,h=a.size
  if x+w+4>2048:x=0;y+=row;row=0
  if y+h+4>2048:flush()
  im.paste(a,(x+2,y+2));used.append((src,x+2,y+2,w,h));x+=w+4;row=max(row,h+4)
 flush()
 for a in refs:
  if a['src']in positions:a['src'],a['crop']=positions[a['src']]
for folder,docs in documents.items():
 for d in docs.values():
  for n in visit(d['tree']):
   for k in ['x','y','w','h']:
    for a in ([n['art']]if n.get('art')else[])+n.get('frames',[]):
     if k in a:a[k]=round(a[k],1)
   for k in ['left','top','right','bottom','width','height']:
    v=n.get('style',{}).get(k,'')
    if isinstance(v,str)and v.endswith('px'):
     try:n['style'][k]=str(round(float(v[:-2]),1))+'px'
     except ValueError:pass
 (folder/'scenes.json').write_text(json.dumps(docs,separators=(',',':'),ensure_ascii=False))
 for path in (folder/'art').glob('*.png'):path.unlink()
print('shared bank',len(list(bank.iterdir())),sum(p.stat().st_size for p in bank.iterdir()))
