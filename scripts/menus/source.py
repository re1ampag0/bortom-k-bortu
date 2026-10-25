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
