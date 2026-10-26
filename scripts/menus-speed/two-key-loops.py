"""Preserve the interior of a two-key loop: a closed curve must not become a constant."""
from pathlib import Path
import json,re,copy

def walk(ns):
 for n in ns:yield n;yield from walk(n['children'])
def mix(a,b,p):
 if a=='none':a='matrix(1,0,0,1,0,0)'
 if b=='none':b='matrix(1,0,0,1,0,0)'
 pat=r'-?\d*\.?\d+(?:e[+-]?\d+)?';av=list(map(float,re.findall(pat,a)));bv=list(map(float,re.findall(pat,b)));v=iter(x+(y-x)*p for x,y in zip(av,bv));return re.sub(pat,lambda _:str(round(next(v),7)),b)
for family in ['menus','ship','weather']:
 folder=Path('src/ui/menus'if family=='menus'else f'src/ui/game/{family}-window');p=folder/'scenes.json';data=json.loads(p.read_text());original=Path('/workspace/menus-speed-before')/p;old=json.loads(original.read_text())if original.exists()else{}
 for key,s in data.items():
  oldnodes={n['id']:n for n in walk(old.get(key,{}).get('tree',[]))}
  for n in walk(s['tree']):
   if n.get('periodicSubtree')or n.get('art',{}).get('tile'):continue
   for a in n['anim']:
    if not a.get('closedRevision')or a.get('twoKeyClosed'):continue
    oa=next((x for x in oldnodes.get(n['id'],{}).get('anim',[])if x['name']==a['name']),a);fs=a.get('originalFrames',oa['frames'])
    if len(fs)!=2 or not any('transform'in f or'opacity'in f for f in fs):continue
    first,last=fs
    if first.get('transform')==last.get('transform')and first.get('opacity')==last.get('opacity'):continue
    alpha=float(first.get('opacity',n['style'].get('opacity',1)));f0={k:v for k,v in first.items()if k in ['offset','easing','transform','opacity']};f1={k:v for k,v in last.items()if k in ['offset','easing','transform','opacity']};mid={**f0,'offset':.025,'opacity':alpha}
    if 'transform'in f0 and'transform'in f1:mid['transform']=mix(f0['transform'],f1['transform'],.025)
    frames=[{**f0,'opacity':0},mid]
    if float(last.get('opacity',1))>.15:
     near={**f1,'offset':.975,'opacity':alpha}
     if'transform'in f0 and'transform'in f1:near['transform']=mix(f0['transform'],f1['transform'],.975)
     frames.append(near)
    frames.append({**f1,'opacity':0});a['frames']=frames;a['twoKeyClosed']=True
    print(family,key,n['id'],a['name'],'original travel; transparent wrap')
 p.write_text(json.dumps(data,separators=(',',':'),ensure_ascii=False))
