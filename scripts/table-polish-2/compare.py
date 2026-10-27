from pathlib import Path
from PIL import Image, ImageDraw
import json,html
root=Path('docs/screenshots/table-polish-2');out=root/'compare';out.mkdir(exist_ok=True);rows=[]
for after in sorted((root/'after').glob('*/*.png')):
 rel=after.relative_to(root/'after');before=root/'before'/rel
 if not before.exists():continue
 a=Image.open(before).convert('RGB');b=Image.open(after).convert('RGB')
 # Both source captures have DPR 2. Compare at the same CSS size, keeping originals beside them.
 a=a.resize((a.width//2,a.height//2),Image.Resampling.LANCZOS);b=b.resize((b.width//2,b.height//2),Image.Resampling.LANCZOS)
 image=Image.new('RGB',(a.width+b.width,max(a.height,b.height)+32),'#211b15');d=ImageDraw.Draw(image);d.text((12,9),'BEFORE / main 23e7c7ba',fill='#ecd9a0');d.text((a.width+12,9),'AFTER / table-polish-2',fill='#ecd9a0');image.paste(a,(0,32));image.paste(b,(a.width,32));name=str(rel).replace('/','-').replace('.png','.jpg');image.save(out/name,quality=90);rows.append({'size':rel.parts[0],'state':rel.stem,'compare':'compare/'+name})
(root/'index.html').write_text('<!doctype html><meta charset="utf-8"><title>table-polish-2: до | после</title><style>body{background:#211b15;color:#ecd9a0;font:16px system-ui}img{max-width:100%;height:auto}section{margin-bottom:32px}</style><h1>table-polish-2: до | после</h1>'+''.join('<section><h2>'+html.escape(x['size']+' · '+x['state'])+'</h2><a href="'+x['compare']+'"><img loading="lazy" src="'+x['compare']+'"></a></section>'for x in rows))
(root/'comparisons.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2));print(len(rows),'comparison frames')
