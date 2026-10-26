// User frames and DOM hit/geometry notes; no Playwright test suite.
import{chromium}from'@playwright/test';import{readFileSync,writeFileSync,mkdirSync}from'node:fs';
const out='docs/screenshots/menus-speed';mkdirSync(out,{recursive:true});const browser=await chromium.launch({executablePath:'/usr/bin/chromium'}),proof=[],fixtures=JSON.parse(readFileSync('docs/screenshots/game-phone-fix/fixtures.json')),base=process.env.CAPTURE_URL??'http://127.0.0.1:5370/bortom-k-bortu/',prefix=process.env.BEFORE_UI?'before-':'';
const scenes=[['menus','Main'],['menus','Phone'],['menus','Pirates'],['menus','Company'],['menus','Blood'],['ship','Ж'],['ship','М'],['ship','И'],['ship','Г'],['weather','storm'],['weather','tortuga']];
async function pose(p,t){await p.evaluate(t=>{document.querySelector('.sw-native-scene')?.captureScene?.(t);for(const a of document.getAnimations()){a.pause();a.currentTime=t}},t)}
try{
 if(!process.env.UI_ONLY)for(const [family,name]of scenes.filter(([f,n])=>!process.env.SCENE_KEYS||process.env.SCENE_KEYS.split(',').includes(f+':'+n))){const folder=family==='menus'?'src/ui/menus':`src/ui/game/${family}-window`,s=JSON.parse(readFileSync(folder+'/scenes.json'))[name];
  for(const before of [true,false]){const p=await browser.newPage({viewport:{width:s.width,height:s.height},deviceScaleFactor:1});await p.goto(base+`scripts/menus-speed/scene.html?family=${family}&name=${name}${before?'&before=1':''}`);await p.waitForSelector('[data-ready="1"]');await pose(p,1000);await p.locator('#root').screenshot({path:`${out}/${family}-${name}-${before?'before':'after'}.png`,omitBackground:true});
   if(!before&&family==='ship'&&name==='М'){
    await pose(p,870);await p.screenshot({path:out+'/Revenge-volley-after.png',omitBackground:true});const ports=JSON.parse(readFileSync('docs/measurements/menus-speed/ports.json'));await p.evaluate(ports=>{const ship=document.querySelector('[data-sw-layer="61"]');for(const port of ports){const m=document.createElement('i');m.style.cssText=`position:absolute;left:${port.local[0]-3}px;top:${port.local[1]-3}px;width:6px;height:6px;border:1px solid cyan;border-radius:50%;z-index:99`;ship.append(m)}},ports);await p.screenshot({path:out+'/Revenge-ports-marked.png',omitBackground:true});
   }
   if(!before&&family==='ship'&&name==='Ж'){const beam=s.tree.flatMap(function walk(n){return[n,...n.children.flatMap(walk)]}).flatMap(n=>n.anim).find(a=>a.name==='jw-beam');for(let i=0;i<4;i++){await pose(p,Number(beam.timing.duration)*i/4);await p.screenshot({path:`${out}/Pearl-beam-${i}.png`,omitBackground:true});}}
   await p.close();
  }console.log('frames',family,name);
 }
 if(!process.env.SCENES_ONLY)for(const [width,height]of [[1366,660],[390,844]]){
  const p=await browser.newPage({viewport:{width,height}});p.setDefaultTimeout(20000);const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(base+'?seed=1&speed=instant');await p.waitForSelector('.menu-start-hero [data-ready="1"]');await pose(p,1000);await p.screenshot({path:`${out}/${prefix}start-${width}.png`});
  await p.getByTestId('quick-duo').click();await p.getByTestId('pick-pirates').click();await p.getByTestId('prep-start').click();await p.waitForSelector('.menu-placement-board .sw-native-scene[data-ready="1"]');await pose(p,1000);
  const button=p.getByRole('button',{name:'Переставить корабли',exact:true}).first(),getOrder=()=>p.locator('.menu-slot-name h2').allTextContents();const before=await getOrder();if(process.env.BEFORE_UI)await button.evaluate(e=>e.click());else await button.click();const after=await getOrder();await p.mouse.move(0,0);await p.screenshot({path:`${out}/${prefix}placement-${width}.png`});proof.push({screen:'placement',width,before,after,button:await button.evaluate(e=>({rect:e.getBoundingClientRect().toJSON(),disabled:e.disabled,hit:e.contains(document.elementFromPoint(e.getBoundingClientRect().x+e.clientWidth/2,e.getBoundingClientRect().y+e.clientHeight/2))})),errors});
  for(const [kind,f,code]of [['window',fixtures.table,'Ж'],['unplayed',fixtures.captain,'М'],['played',{record:{...fixtures.legend.record,actions:[...fixtures.legend.record.actions,{type:'playLegend',seat:'И'}]}},'И']]){
   await p.evaluate(record=>localStorage.setItem('bortom-k-bortu.save',JSON.stringify(record)),f.record);await p.goto(base+'?speed=instant');await p.getByTestId('resume-go').click();await p.getByTestId('plank-'+code).locator('.plank-head').click({position:{x:8,y:8}});await p.getByTestId('ship-sheet').waitFor();await p.waitForSelector('.ship-window [data-ready="1"]');await pose(p,1000);await p.screenshot({path:`${out}/${prefix}ship-${kind}-${width}.png`});proof.push({screen:kind,width,stamp:await p.locator('.sw-spent-label').allTextContents(),aria:await p.locator('.sw-legend-card').getAttribute('aria-label'),errors});
   if(width===390){await p.locator('.sw-legend-card').scrollIntoViewIfNeeded();await p.screenshot({path:`${out}/${prefix}ship-${kind}-stamp-${width}.png`});}
   await p.getByTestId('ship-sheet').getByRole('button',{name:'Закрыть',exact:true}).click();
  }
  await p.close();
 }
}finally{if(!process.env.SCENES_ONLY)writeFileSync(out+'/'+prefix+'capture.json',JSON.stringify(proof,null,2));await browser.close();}
