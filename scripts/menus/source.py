"""Prepare accepted artwork, not application state or a test."""
import sys,pathlib
sys.path.insert(0,str(pathlib.Path('docs/mockups/menus/generator/v2').resolve()))
import art,main_board as m,prep_board as p,common,fort
out=pathlib.Path('tmp/menus-source/artboards')
def save(name,w,h,content,css=''):
 content=content.replace('../assets/ship_','../assets/ships/ship_')
 text=f'<html><head><style>body{{margin:0;background:transparent}}{common.CSS}{art.SEA_CSS}{art.LIGHT_CSS}{fort.FORT_CSS}{css}</style></head><body><div id="menu-art" style="position:relative;width:{w}px;height:{h}px;overflow:hidden">{content}</div></body></html>'
 (out/(name+'.dc.html')).write_text(text)
s,css=m.scene_laptop();save('Main',1366,340,s,css)
s,css=m.scene_phone();save('Phone',390,300,s,css)
for side,fn in [('Pirates',p.pirates_scene),('Company',p.company_scene)]:
 for suf,w,h,k in [('',416,140,1),('Phone',354,132,.9)]:
  s,css=fn(w,h,'menu'+side+suf,k);save(side+suf,w,h,s,css)
for name,pal in [('Panel','panel'),('Blood','blood'),('Deep','deep')]:
 s,css=art.sea(1366,240,'menu'+name,pal,light_x=683)
 save(name,1366,240,s,css)
import chart
for key,name in [('main','ChartMain'),('prep','ChartPrep'),('net','ChartNet'),('phone-main','ChartPhoneMain'),('phone','ChartPhone')]:
 s,css=chart.anim_layer(key);v=chart.VARIANTS[key];save(name,v['W'],v['H'],s,chart.CHART_CSS+css)
for name in ['pearl','revenge','endeavour','dutch','engraved_ink']:
 save('Boat_'+name,220,160,art.ship(name,10,112,200,130,False,shadow=True))
 if name!='engraved_ink':
  pal='deep'
  s='<svg width="260" height="73" xmlns="http://www.w3.org/2000/svg">'+art.sky(260,73,'dock'+name,pal,stars=0)+'</svg>'
  sea,css=art.sea(260,28,'dock'+name,pal,light_x=175)
  s+='<div style="position:absolute;left:0;top:72px;width:260px;height:28px;overflow:hidden">'+sea+'</div>'+art.ship(name,55,74,150,98,False,shadow=True)
  save('Dock_'+name,260,100,s,css)
spark=''.join(f'<span class="tw" style="position:absolute;left:{x}%;top:{y}%;width:14px;height:14px;border-radius:50%;background:radial-gradient(#fff3c4,#ffdc8c55 20%,transparent 70%);animation-delay:-{i*.7}s"></span>' for i,(x,y) in enumerate([(26,22),(74,18),(80,52),(20,58),(66,34)]))
save('CoinSpark',300,212,spark+'<span style="position:absolute;left:85px;top:155px;width:130px;height:26px;border-radius:50%;background:radial-gradient(closest-side,#0009,transparent)"></span>')
