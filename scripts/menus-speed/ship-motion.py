from pathlib import Path
import json,copy,math
p=Path('src/ui/game/ship-window/scenes.json');scenes=json.loads(p.read_text());ports=[]
def walk(ns):
 for n in ns:
  yield n
  yield from walk(n['children'])
for code,scene in scenes.items():
 if scene.get("motionRevision")=="menus-speed":continue
 scene["motionRevision"]="menus-speed"
 index=0
 for n in list(walk(scene['tree'])):
  if n.get('motionRevision')=='menus-speed':continue
  names=[a['name']for a in n['anim']]
  for a in n['anim']:
   if a['name']in ['jfL','jfA','jfG','jw-camp','jw-lamp','jw-frefl','rfL','rfA','rfG']:
    a['timing']['duration']=2700+(n['id']%5)*100;a['timing']['delay']=-(n['id']*197)%2900;a['timing']['easing']='linear'
   if a['name']=='jw-beam':n['style']['transformOrigin']='0px -7.5px'
   if a['name']=='r-farsm':
    a['timing'].update(duration=6800+(index%4)*700,delay=-index*1300,easing='linear');a['frames']=[{'offset':0,'opacity':0,'transform':'translate(0px,0px) scale(1)'},{'offset':.15,'opacity':.4,'transform':'translate(-4px,-8px) scale(1.05)'},{'offset':.7,'opacity':.25,'transform':'translate(-20px,-38px) scale(1.3)'},{'offset':1,'opacity':0,'transform':'translate(-30px,-55px) scale(1.4)'}];index+=1
  if code=='М' and n.get('frames') and n['id']in [13,23,110]:n['frameTiming'].update(duration=2800,delay=-n['id']*137,easing='linear')
  n['motionRevision']='menus-speed'
 if code=='М':
  nodes={n['id']:n for n in walk(scene['tree'])};ship=nodes[61];spark=next(n for n in walk(scene['tree'])if n.get('cls')=='r-spk');nid=max(nodes)+1
  for i,(source_x,source_y)in enumerate([(44,60.69),(58,60.18),(72,59.68),(86,59.17)]):
   x,y=source_x*270/120,source_y*175/78;ports.append({'ship':'М','port':i,'source':[source_x,source_y],'local':[x,y],'sourceViewBox':[120,78],'display':[270,175]})
   flash=nodes[64+i*2];puff=nodes[65+i*2]
   for n,radius in [(flash,9),(puff,11)]:n['style'].update(left=f'{x-radius}px',top=f'{y-radius}px',zIndex='10')
   for a in flash['anim']:a['timing'].update(duration=8000,delay=i*160,easing='linear');a['frames']=[{'offset':0,'opacity':0,'transform':'scale(.4)'},{'offset':.1,'opacity':0,'transform':'scale(.4)'},{'offset':.103,'opacity':1,'transform':'scale(1)'},{'offset':.1125,'opacity':0,'transform':'scale(1.15)'},{'offset':1,'opacity':0,'transform':'scale(1.15)'}]
   for a in puff['anim']:a['timing'].update(duration=8000,delay=i*160,easing='linear');a['frames']=[{'offset':0,'opacity':0,'transform':'translate(0px,0px) scale(.4)'},{'offset':.1,'opacity':0,'transform':'translate(0px,0px) scale(.4)'},{'offset':.12,'opacity':.95,'transform':'translate(-2px,-2px) scale(.8)'},{'offset':.38,'opacity':0,'transform':'translate(-40px,-28px) scale(2.6)'},{'offset':1,'opacity':0,'transform':'translate(-40px,-28px) scale(2.6)'}]
   # Sparks share the existing prepared texture and the scene's single particle clock.
   for j in range(10):
    n=copy.deepcopy(spark);n['id']=nid;nid+=1;n['cls']='sx-port-spark';n['particle']=True;n['style'].update(left=f'{x}px',top=f'{y}px',zIndex='11');n['anim']=[{'name':'sx-port-spark','timing':{'duration':8000,'delay':i*160,'iterations':None,'fill':'both','easing':'linear'},'frames':[{'offset':0,'opacity':0,'transform':'translate(0px,0px)'},{'offset':.103,'opacity':0,'transform':'translate(0px,0px)'},{'offset':.108,'opacity':1,'transform':f'translate({8+j}px,{-8+j}px)'},{'offset':.16,'opacity':0,'transform':f'translate({25+j*2}px,{-20+j*3}px)'},{'offset':1,'opacity':0,'transform':f'translate({25+j*2}px,{-20+j*3}px)'}]}];ship['children'].append(n)
   for label,yy,aw,ah,alpha in [('sx-port-flame',y,28,7,.8),('sx-port-reflection',y+28,52,8,.2)]:
    n=copy.deepcopy(flash);n['id']=nid;nid+=1;n['cls']=label;n['style'].update(left=f'{x}px',top=f'{yy}px',zIndex='9');n['art'].update(x=-aw/2,y=-ah/2,w=aw,h=ah);n['anim'][0]['name']=label
    for f in n['anim'][0]['frames']:f['opacity']=float(f.get('opacity',0))*alpha
    ship['children'].append(n)
# The large burning ship has its own rising smoke, separate from the small boat.
revenge=scenes['М']
if not revenge.get('smokeRevision'):
 keep={24,25,28,30,33,34};index=0
 def prune(ns):
  global index
  out=[]
  for n in ns:
   if n.get('cls')=='r-smoke':
    if n['id']not in keep:continue
    for a in n['anim']:
     if a['name']=='r-rise':
      a['timing'].update(duration=6800+index*500,delay=-index*1300,easing='linear')
      a['frames']=[{'offset':0,'opacity':0,'transform':'translate(0px,0px) scale(1)'},{'offset':.15,'opacity':.5,'transform':'translate(-3px,-8px) scale(1.05)'},{'offset':.7,'opacity':.3,'transform':'translate(-20px,-38px) scale(1.3)'},{'offset':1,'opacity':0,'transform':'translate(-30px,-55px) scale(1.4)'}]
    index+=1
   n['children']=prune(n['children']);out.append(n)
  return out
 revenge['tree']=prune(revenge['tree']);revenge['smokeRevision']=1
p.write_text(json.dumps(scenes,separators=(',',':'),ensure_ascii=False))
if ports:Path('docs/measurements/menus-speed/ports.json').write_text(json.dumps(ports,indent=2))
