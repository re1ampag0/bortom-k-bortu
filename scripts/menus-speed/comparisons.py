from pathlib import Path
from PIL import Image,ImageDraw,ImageFont,ImageChops,ImageStat
import json,math,collections
root=Path('docs/screenshots/menus-speed');font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',16);pictures=[]
for before in root.glob('*-before.png'):
 after=before.with_name(before.name.replace('-before.png','-after.png'))
 if not after.exists():continue
 a=Image.open(before).convert('RGB');b=Image.open(after).convert('RGB');out=Image.new('RGB',(a.width+b.width+8,max(a.height,b.height)+30),'#efe5ce');out.paste(a,(0,30));out.paste(b,(a.width+8,30));d=ImageDraw.Draw(out);d.text((8,5),'ДО · main 4f14c88',font=font,fill='#251c14');d.text((a.width+16,5),'ПОСЛЕ · menus-speed',font=font,fill='#251c14');path=before.with_name(before.name.replace('-before.png','-comparison.jpg'));out.save(path,quality=95);pictures.append(path.name)
# End | beginning proof for every repaired animation whose sample was retained.
seams=root/'seams';groups=collections.defaultdict(list)
for p in seams.glob('*-end.png'):
 q=p.with_name(p.name.replace('-end.png','-start.png'))
 if not q.exists():continue
 a,b=Image.open(p),Image.open(q);im=Image.new('RGBA',(a.width+b.width+8,max(a.height,b.height)+28),'#173745');im.paste(a,(0,28));im.paste(b,(a.width+8,28));d=ImageDraw.Draw(im);d.text((8,3),'КОНЕЦ',font=font,fill='white');d.text((a.width+16,3),'НАЧАЛО',font=font,fill='white');im.convert('RGB').save(p.with_name(p.name.replace('-end.png','-comparison.jpg')),quality=90)
# The raw inventory retains tiny edge-resampling differences rather than hiding them.
rows=json.loads(Path('docs/measurements/menus-speed/seams-final.json').read_text());updates={}
for name in ['rain-final','cloud-final','two-key-final','smoke-final']:
 for r in json.loads(Path(f'docs/measurements/menus-speed/seams-{name}.json').read_text()):updates[(r['family'],r['name'],r['id'],r['animation'])]=r
before={(r['family'],r['name'],r['id'],r['animation']):r for r in json.loads(Path('docs/measurements/menus-speed/seams-before-fix.json').read_text())}
for i,r in enumerate(rows):
 key=(r['family'],r['name'],r['id'],r['animation']);r=updates.get(key,r);rows[i]=r
 if not r.get('alternate'):r['seam']=r['atEnd']['pixels']>100
 r['beforeSeam']=before.get(key,{}).get('seam',False)
Path('docs/measurements/menus-speed/loops.json').write_text(json.dumps(rows,ensure_ascii=False,separators=(',',':')))
with Path('docs/measurements/menus-speed/loops.md').open('w')as f:
 f.write('| Семейство / сцена | Слой | Анимация | Шов до | Шов после | Решение |\n|---|---:|---|---|---|---|\n')
 for r in rows:
  action='alternate, без изменений'if r.get('alternate')else 'границы уже совпадали'
  if r.get('beforeSeam'):action='плавное замыкание кривой; без сброса часов'
  if (r['family'],r['name'],r['id'],r['animation'])in updates:action='периодичная картинка или прозрачный стык, исходное движение'
  f.write(f'| {r["family"]} / {r["name"]} | {r["id"]} | {r["animation"]} | {"alternate"if r.get("alternate")else "да"if r["beforeSeam"]else "нет"} | {"да"if r["seam"]else "нет"} | {action} |\n')
print('comparisons',len(pictures),'loop entries',len(rows),'seams',sum(r['seam']for r in rows))
