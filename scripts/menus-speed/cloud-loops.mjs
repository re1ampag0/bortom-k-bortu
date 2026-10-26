// A drifting static subtree is one periodic picture, not a rapid return to its starting point.
import{chromium}from'@playwright/test';import{readFileSync,writeFileSync,existsSync}from'node:fs';import{execFileSync}from'node:child_process';
const origin=process.env.SCENE_PREP_URL??'http://127.0.0.1:5370',browser=await chromium.launch({executablePath:'/usr/bin/chromium'}),p=await browser.newPage({deviceScaleFactor:2});
const walk=ns=>ns.flatMap(n=>[n,...walk(n.children)]),names=/^(?:r-cl|d-cl|m-cl|jw-cloud|sc-cl|w-drift|rn-cur-(?:storm|wet|wave|thunder)|sc-flowL)$/;
try{for(const family of ['ship','weather']){const folder=`src/ui/game/${family}-window`,data=JSON.parse(readFileSync(folder+'/scenes.json')),old=existsSync('/workspace/menus-speed-before/'+folder+'/scenes.json')?JSON.parse(readFileSync('/workspace/menus-speed-before/'+folder+'/scenes.json')):{};
 for(const [key,s]of Object.entries(data)){
  const nodes=walk(s.tree).filter(n=>!n.periodicSubtree&&n.anim.some(a=>names.test(a.name)));if(!nodes.length)continue;
  await p.setViewportSize({width:s.width,height:s.height});await p.goto(`${origin}/bortom-k-bortu/scripts/menus-speed/scene.html?family=${family}&name=${key}`);await p.waitForSelector('[data-ready="1"]');
  for(const n of nodes){const a=n.anim.find(a=>names.test(a.name)),source=a.originalFrames?{frames:a.originalFrames}:old[key]?walk(old[key].tree).find(x=>x.id===n.id)?.anim.find(x=>x.name===a.name):a;if(!source)continue;
   const last=source.frames.at(-1).transform??'',v=last.match(/-?\d*\.?\d+(?:e[+-]?\d+)?/g)?.map(Number)??[],dx=last.startsWith('matrix(')?v[4]:last.startsWith('translateX(')?v[0]:0,period=Math.round(Math.abs(dx));if(!period)continue;
   const w=Math.ceil(parseFloat(n.style.width)),h=Math.ceil(parseFloat(n.style.height));if(!w||!h)continue;
   await p.setViewportSize({width:w,height:h});await p.evaluate(({n,w,h})=>{const local=structuredClone(n);local.anim=[];Object.assign(local.style,{left:'0px',top:'0px',transform:'none',opacity:'1',width:w+'px',height:h+'px'});const root=document.querySelector('#root');root.style.width=w+'px';root.style.height=h+'px';window.renderScene({width:w,height:h,tree:[local]});},{n,w,h});await p.waitForTimeout(30);await p.evaluate(()=>document.querySelector('.sw-native-scene').captureScene(0));await p.locator('#root').screenshot({path:'/tmp/menus-cloud.png',omitBackground:true});
   const src=execFileSync('python3',['-c',`from PIL import Image;import io,hashlib;from pathlib import Path;im=Image.open('/tmp/menus-cloud.png').crop((0,0,${period*2},${h*2}));b=io.BytesIO();im.save(b,format='WEBP',quality=90,method=4,exact=True);raw=b.getvalue();name='art-'+hashlib.sha256(raw).hexdigest()[:20]+'.webp';Path('src/ui/game/scene-window/art/'+name).write_bytes(raw);print(name)`]).toString().trim();
   n.art={src,x:0,y:0,w:s.width+period*2,h,tile:{period,origin:0}};delete n.image;n.children=[];n.style.width=n.art.w+'px';a.frames=[{offset:0,transform:'translateX(0px)'},{offset:1,transform:`translateX(${Math.sign(dx)*period}px)`}];n.periodicSubtree=true;console.log(family,key,a.name,period);
  }
 }
 writeFileSync(folder+'/scenes.json',JSON.stringify(data));
}}finally{await browser.close();}
