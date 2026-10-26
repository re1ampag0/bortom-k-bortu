"""Static pixel/geometry report and mockup pairs. Does not run the game or tests."""
from PIL import Image,ImageDraw
from pathlib import Path
import json
root=Path('docs/screenshots/game-phone-fix');mock=Path('docs/mockups/2026-10-26')
rows=json.loads((root/'frames.json').read_text());summary={'frames':len(rows),'errors':[r for r in rows if 'error' in r]}
summary['horizontalScroll']=[(r['size'],r['screen'])for r in rows if r.get('horizontalScroll')]
summary['barOutside']=[(r['size'],r['screen'])for r in rows if r.get('bar',{}).get('width',0)>0 and r['bar']['bottom']>int(r['size'].split('x')[1])+.5]
summary['lightWithoutLamp']=[(r['size'],r['screen'])for r in rows if r.get('lightWithoutLamp')]
summary['lampOverlaps']=[(r['size'],r['screen'],r['lampOverlaps'])for r in rows if r.get('lampOverlaps')]
summary['clippedVisibleCards']=[]
for r in rows:
 if r.get('screen')!='table' or not r.get('cards'):continue
 for c in r['cards']:
  b=c['r']
  if b['x']>=0 and b['right']<=int(r['size'].split('x')[0]):
   if r['bar']['width'] and b['bottom']>r['bar']['top']+.5:summary['clippedVisibleCards'].append((r['size'],b))
summary['buttons']=[]
for r in rows:
 if 'error'in r:continue
 w,h=map(int,r['size'].split('x'));screen=r['screen']
 for b in r.get('buttons',[]):
  if b['disabled']:continue
  # Preserve raw geometry. A ribbon's offscreen entries and inactive background are intentional.
  if b.get('id') in ['play-card','confirm-yes','no-plans','skip-reaction','play-reaction'] or (screen=='table' and (b.get('id','').startswith('volley-') or b.get('id')=='end-turn')):
   if not b['hit']:summary['buttons'].append({'size':r['size'],'screen':screen,'button':b})
(root/'layout-summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2))

def pair(reference,result,out):
 a,b=Image.open(reference).convert('RGB'),Image.open(result).convert('RGB');width=680 if b.width>700 else 390
 def fit(im):return im.resize((width,round(im.height*width/im.width)),Image.Resampling.LANCZOS)
 a,b=fit(a),fit(b);canvas=Image.new('RGB',(2*width+12,max(a.height,b.height)+28),'#18232a');canvas.paste(a,(0,28));canvas.paste(b,(width+12,28));d=ImageDraw.Draw(canvas);d.text((12,8),'MOCKUP',fill='#e4cd8d');d.text((width+24,8),'GAME',fill='#e4cd8d');canvas.save(out)
pairs=[('phone-after3.jpg','390x640/table.png'),('ordA-phone-0-v3.jpg','390x640/order-sheet-0.png'),('ordA-phone-1-v3.jpg','390x640/order-sheet.png'),('ordD-phone-1-v3.jpg','390x640/order-scroll.png'),('plans-phone-A-v2.jpg','390x640/plans-sheet.png'),('plans-phone-D-v2.jpg','390x640/plans-scroll.png'),('ordA-1-v3.jpg','1366x660/order-sheet.png'),('ordD-1-v3.jpg','1366x660/order-scroll.png'),('plans-A-1-v2.jpg','1366x660/plans-sheet.png'),('plans-D-1-v2.jpg','1366x660/plans-scroll.png'),('captain-after3.jpg','1366x660/captain-with.png')]
(root/'compare').mkdir(exist_ok=True)
for name,result in pairs:
 if (mock/name).exists() and (root/result).exists():pair(mock/name,root/result,root/'compare'/f'{name[:-4]}.png')
thumbs=[]
for r in rows:
 if 'error'in r:continue
 f=root/r['size']/(r['screen']+'.png')
 if not f.exists():continue
 im=Image.open(f).convert('RGB');im.thumbnail((300,250),Image.Resampling.LANCZOS);tile=Image.new('RGB',(310,278),'#18232a');tile.paste(im,((310-im.width)//2,28));ImageDraw.Draw(tile).text((8,8),r['size']+' '+r['screen'],fill='#e4cd8d');thumbs.append(tile)
sheet=Image.new('RGB',(1240,((len(thumbs)+3)//4)*278),'#18232a')
for i,t in enumerate(thumbs):sheet.paste(t,((i%4)*310,(i//4)*278))
sheet.save(root/'contact-sheet.jpg',quality=88)
# Exact comparison, without ignoring rendering differences or adding a colour tolerance.
reference=root/'reference';diffs=[]
for size in ['1366x660','430x932']:
 for state in ['table','log','reaction']:
  a=Image.open(reference/'before'/size/(state+'.png')).convert('RGB');b=Image.open(reference/'after'/size/(state+'.png')).convert('RGB')
  changed=[];outside=0;box=None
  # The desktop log's scrollable paper is explicitly restyled by requirement 10.
  for y in range(a.height):
   for x in range(a.width):
    if a.getpixel((x,y))!=b.getpixel((x,y)):
     changed.append((x,y));outside+=int(not(size=='1366x660' and 1066<=x<1354 and 94<=y<420))
  if changed:box=[min(x for x,y in changed),min(y for x,y in changed),max(x for x,y in changed),max(y for x,y in changed)]
  diffs.append({'size':size,'screen':state,'pixels':len(changed),'outsideDesktopLog':outside,'bbox':box})
(reference/'summary.json').write_text(json.dumps(diffs,indent=2));print(json.dumps({k:v for k,v in summary.items()if k!='buttons'},ensure_ascii=False));print('button warnings',len(summary['buttons']));print(json.dumps(diffs))
# Explicit untouched regions use the original measured middle rectangle, without tolerance.
import math
ma=json.loads((reference/'before-frames.json').read_text());mb=json.loads((reference/'after-frames.json').read_text())
f=lambda m:next(x for x in m if x['size']=='430x932'and x['screen']=='table')
ra,rb=f(ma),f(mb);out={'phoneGeometry':[],'unchangedPixelRegions':[]}
for cls in ['status','sea-table has-info','planks top','planks bottom']:
 aa=next(x for x in ra['geometry']if x['cls']==cls)['r'];bb=next(x for x in rb['geometry']if x['cls']==cls)['r'];out['phoneGeometry'].append({'class':cls,'before':aa,'after':bb,'equal':aa==bb})
a=Image.open(reference/'before/430x932/table.png').convert('RGB');b=Image.open(reference/'after/430x932/table.png').convert('RGB');mid=next(x for x in ra['geometry']if str(x['cls']).strip()=='middle')['r'];box=(math.ceil(mid['left']),math.ceil(mid['top']),math.floor(mid['right']),math.floor(mid['bottom']))
for name,q in [('wholeMiddle',box),('topBar',(0,0,430,45)),('bottomBar',(0,861,430,932))]:
 n=sum(a.getpixel((x,y))!=b.getpixel((x,y))for y in range(q[1],q[3])for x in range(q[0],q[2]));out['unchangedPixelRegions'].append({'name':name,'box':q,'pixels':n})
(reference/'unchanged-regions.json').write_text(json.dumps(out,indent=2))
