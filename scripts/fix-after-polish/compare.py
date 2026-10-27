from PIL import Image,ImageDraw
from pathlib import Path
import json,html
root=Path('docs/screenshots/fix-after-polish');ref=Path('docs/mockups/2026-10-26');out=root/'compare';out.mkdir(exist_ok=True)
pairs=[('sea-clip','a7-strip-after.jpg'),('round-banner','a7-strip-after.jpg'),('table','wide-after2.jpg'),('card','f8-card-after.jpg'),('card-cant','f8-cant-after.jpg'),('legend','c9-legend-after.jpg'),('reaction','b8-react-after.jpg'),('scroll-reaction','ordD-0-v3.jpg'),('scroll-card','ordD-0-v3.jpg'),('victory','a7-victory-after.jpg'),('after-game','a7-after-after.jpg'),('net-error','b8-neterr-after.jpg'),('tortuga','d11-tortuga-after.jpg'),('plans','plans-A-0-v2.jpg'),('friend-left','d11-friendleft-after.jpg'),('catalog','coll-after2.jpg')]
rows=[]
for size in ['1366x660','390x640']:
 for name,r in pairs:
  if size=='390x640':r={'table':'phone-after3.jpg','net-error':'b8-neterr-phone-after.jpg','plans':'plans-phone-A-v2.jpg','catalog':'coll-phone-after2.jpg','scroll-card':'ordD-phone-0-v3.jpg'}.get(name,r)
  a=root/size/(name+'.png');rp=ref/r
  if not a.exists() or not rp.exists():continue
  imgs=[Image.open(rp).convert('RGB'),Image.open(a).convert('RGB')];panels=[]
  for im in imgs:
   im.thumbnail((960,900));panels.append(im)
  w=sum(i.width for i in panels)+24;h=max(i.height for i in panels)+45;c=Image.new('RGB',(w,h),'#25201b');d=ImageDraw.Draw(c);x=0
  for label,im in zip(['Mockup','Game '+size],panels):d.text((x+6,10),label,fill='white');c.paste(im,(x,35));x+=im.width+24
  target=out/(size+'-'+name+'.jpg');c.save(target,quality=88);rows.append({'size':size,'state':name,'reference':str(rp),'game':str(a),'compare':str(target)})
(root/'comparisons.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2));(root/'index.html').write_text('<meta charset="utf-8"><title>fix-after-polish</title><style>body{background:#211c16;color:#f4e7c3;font:18px sans-serif}img{max-width:100%}section{margin-bottom:40px}</style>'+''.join('<section><h2>'+html.escape(r['size']+' '+r['state'])+'</h2><p>'+html.escape(r['reference'])+'</p><img loading="lazy" src="compare/'+Path(r['compare']).name+'"></section>' for r in rows));print(len(rows),'comparisons')
