"""Report artifacts only: boards on the left, captured UI on the right; never a pixel test."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import json
root=Path('docs/screenshots/ui-polish');boards=Path('docs/mockups/2026-10-26');out=root/'compare';out.mkdir(exist_ok=True)
items={1:('newgame-after2.jpg','newgame'),2:('f8-card-after.jpg','card'),3:('c9-legend-after.jpg','legend'),4:('b8-discard-after.jpg','discard'),5:('d11-revenge-after.jpg','ship-М'),6:('souls-after2.jpg','ship-Г'),7:('coll-after2.jpg','catalog'),8:('a7-victory-after.jpg','victory'),9:('a7-rules-after.jpg','rules'),10:('f8-settings-after.jpg','settings'),11:('d11-friendleft-after.jpg','friend-left'),12:('wide-after2.jpg','table'),13:('a7-after-after.jpg','after-game'),14:('a7-captain-after.jpg','table'),15:('a7-strip-after.jpg','maelstrom'),16:('a7-sea-after.jpg','sea'),17:('d11-tortuga-after.jpg','tortuga'),18:('d11-plate-after.jpg','plate'),19:('f8-cancel-after.jpg','volley'),20:('b8-react-after.jpg','reaction'),21:('b8-endlabel-after.jpg','ending'),22:('f13-sur-lap-B.jpg','settings'),23:('f8-settings-after.jpg','settings'),24:('cards-after.jpg','start'),25:('wide-after2.jpg','table'),26:('wide-after2.jpg','table'),27:('wide-after2.jpg','maelstrom'),28:('wide-after2.jpg','guns'),29:('lightning-after.jpg','lightning'),30:('a7-room-after.jpg','room'),31:('b8-neterr-after.jpg','net-error'),32:('b8-prep-after.jpg','prep'),33:('placement-after2.jpg','placement'),34:('f8-card-after.jpg','card')}
phone={1:'newgame-phone-after2.jpg',7:'coll-phone-after2.jpg',15:'g14-seachip-after.jpg',22:'f13-sur-phone-B.jpg',30:'c9-room-phone-after.jpg',31:'b8-neterr-phone-after.jpg'}
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',18)
manifest=[]
for n,(board,scene) in items.items():
 for size in ['1366x660','1920x969','1024x768','390x844','390x640']:
  src=root/size/(('hover' if n==26 and not size.startswith('390') else scene)+'.png');ref=boards/(phone.get(n,board) if size.startswith('390') else board)
  if not ref.exists():ref=boards/board
  if not src.exists():manifest.append(dict(point=n,size=size,error='No frame'));continue
  a,b=Image.open(ref).convert('RGB'),Image.open(src).convert('RGB');a.thumbnail((650,1100));b.thumbnail((780,1100));im=Image.new('RGB',(1454,max(a.height,b.height)+58),'#182229');im.paste(a,(12+(650-a.width)//2,48));im.paste(b,(674+(780-b.width)//2,48));d=ImageDraw.Draw(im);d.text((12,12),f'{n}. Макет: {ref.name}',font=font,fill='#f0ddb1');d.text((674,12),f'Игра {size}, DPR 2',font=font,fill='#f0ddb1');dest=out/f'{n:02}-{size}.jpg';im.save(dest,quality=86,optimize=True);manifest.append(dict(point=n,size=size,board=str(ref),frame=str(src),compare=str(dest)))
(root/'comparisons.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
print(len(manifest),'comparisons; missing:',sum('error'in r for r in manifest))
