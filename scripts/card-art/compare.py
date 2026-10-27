from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json
root=Path('docs/screenshots/card-art');out=root/'compare';out.mkdir(exist_ok=True);refs=Path('docs/mockups/2026-10-26');rows=[];font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',18)
for size in ['1366x660','1920x969','390x844','390x640']:
 names=['hand-'+c for c in 'ЖМИГ']+['card']+(['lift'] if size.startswith('390') else [])+(['catalog','discard'] if size in ['1366x660','390x844'] else [])
 for name in names:
  src=root/size/(name+'.png')
  ref=refs/('g16-hand-phone.jpg' if size.startswith('390') else 'g16-hand.jpg') if name.startswith('hand-') else refs/('g14-lift-phone.jpg' if name=='lift' else 'deck10-pearl.jpg')
  if not src.exists():rows.append({'size':size,'name':name,'missing':True});continue
  a,b=Image.open(ref).convert('RGB'),Image.open(src).convert('RGB');a.thumbnail((700,1100));b.thumbnail((900,1100));im=Image.new('RGB',(1636,max(a.height,b.height)+56),'#182229');im.paste(a,(12,48));im.paste(b,(724,48));d=ImageDraw.Draw(im);d.text((12,12),'Макет: '+ref.name,font=font,fill='#ecd8ad');d.text((724,12),f'{name} {size} DPR2',font=font,fill='#ecd8ad');dest=out/(size+'-'+name+'.jpg');im.save(dest,quality=88,optimize=True);rows.append({'size':size,'name':name,'frame':str(src),'compare':str(dest)})
(root/'comparisons.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2));(root/'index.html').write_text('<meta charset="utf-8"><title>card-art</title><style>body{background:#182229;color:#ecd8ad;font:18px sans-serif}img{max-width:100%}</style><h1>card-art: макет | игра</h1>'+''.join(f'<h2>{r["size"]} {r["name"]}</h2><img loading="lazy" src="compare/{Path(r["compare"]).name}">' for r in rows if 'compare'in r));print('comparisons',len(rows),'missing',sum('missing'in r for r in rows))
