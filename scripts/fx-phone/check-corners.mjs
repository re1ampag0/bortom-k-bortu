// Controlled animation clock: snapshots every 100 ms, real FX queue and native WAAPI keyframes.
// Independent of CPU measurement. No engine/game data changes.
import {createServer} from 'vite';
import {chromium,expect} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
const server=await createServer({mode:'e2e',server:{host:'127.0.0.1',port:5184,strictPort:true}});
await server.listen();const browser=await chromium.launch({executablePath:'/usr/bin/chromium'}),results=[];
try {for(const scene of ['plain','sink']){
 const page=await browser.newPage({viewport:{width:430,height:740}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.clock.install({time:new Date(0)});await page.clock.pauseAt(new Date(1));
 await page.addInitScript(()=>{
  window.fxCheckAnimations=[];window.fxCheckDelayed=[];
  const native=Element.prototype.animate;
  Element.prototype.animate=function(frames,options){
   const animation=native.call(this,frames,options);animation.pause();animation.currentTime=0;
   window.fxCheckAnimations.push({animation,at:performance.now()});
   if(options.delay>0&&this.closest('.fx-layer'))window.fxCheckDelayed.push({tag:this.tagName,cls:this.getAttribute('class'),delay:options.delay,fill:options.fill,first:frames[0]});
   return animation;
  };
 });
 await page.goto(`http://127.0.0.1:5184/bortom-k-bortu/?fxScene=${scene}&speed=normal&rich=1`);
 await expect(page.locator(`[data-fx-scene="${scene}"]`)).toBeVisible();await page.evaluate(()=>document.fonts.ready);
 const dir=`docs/screenshots/fx-phone/1-${scene}`;mkdirSync(dir,{recursive:true});
 const frames=[];let done=false;
 for(let ms=100;ms<=40000;ms+=100){
  await page.clock.runFor(100);
  await page.evaluate(()=>{
   const now=performance.now();
   for(const row of window.fxCheckAnimations){const a=row.animation;if(a.playState==='idle'||a.playState==='finished')continue;const t=now-row.at,end=a.effect.getComputedTiming().endTime;
    if(t>=end)a.finish();else a.currentTime=Math.max(0,t);
   }
   for(const a of document.getAnimations())if(a instanceof CSSAnimation||a instanceof CSSTransition)a.pause();
  });
  const active=await page.evaluate(()=>({start:!!document.body.dataset.fxStart,done:!!document.body.dataset.fxDone,n:document.querySelectorAll('.fx-layer *').length}));
  const clip={x:0,y:0,width:60,height:60};
  const original=await page.screenshot({clip});
  const flashes=page.locator('.fx-flash-board');
  await flashes.evaluateAll(es=>es.forEach(e=>e.style.visibility='hidden'));
  const visible=await page.screenshot({clip});
  await page.locator('.fx-layer').evaluate(e=>e.style.visibility='hidden');
  const hidden=await page.screenshot({clip});
  await page.locator('.fx-layer').evaluate(e=>e.style.removeProperty('visibility'));
  let changed=0;
  if(!visible.equals(hidden))changed=await page.evaluate(async ({a,b})=>{
   const decode=async base64=>createImageBitmap(await (await fetch('data:image/png;base64,'+base64)).blob());
   const canvas=document.createElement('canvas');canvas.width=canvas.height=60;const c=canvas.getContext('2d');
   c.drawImage(await decode(a),0,0);const x=c.getImageData(0,0,60,60).data;
   c.clearRect(0,0,60,60);c.drawImage(await decode(b),0,0);const y=c.getImageData(0,0,60,60).data;
   let count=0;for(let i=0;i<x.length;i+=4)if(Math.max(...[0,1,2].map(k=>Math.abs(x[i+k]-y[i+k])))>2)count++;return count;
  },{a:visible.toString('base64'),b:hidden.toString('base64')});
  await flashes.evaluateAll(es=>es.forEach(e=>e.style.removeProperty('visibility')));
  writeFileSync(`${dir}/corner-${String(ms).padStart(5,'0')}.png`,original);
  if([100,1000,2000,4000,6000,10000].includes(ms)||changed)await page.screenshot({path:`${dir}/frame-${String(ms).padStart(5,'0')}.png`});
  frames.push({ms,changed,intentionalFlash:!original.equals(visible),...active});
  if(changed){writeFileSync(`${dir}/hidden-${String(ms).padStart(5,'0')}.png`,hidden); console.error('CORNER',scene,ms,changed,JSON.stringify(await page.locator('.fx-layer').evaluate(e=>[...e.querySelectorAll('*')].filter(n=>{const r=n.getBoundingClientRect(),s=getComputedStyle(n);return r.left<60&&r.top<60&&r.right>0&&r.bottom>0&&s.visibility!=='hidden'&&+s.opacity>0}).slice(0,14).map(n=>({tag:n.tagName,cls:n.getAttribute('class'),opacity:getComputedStyle(n).opacity,box:n.getBoundingClientRect().toJSON()})))));break;}
  if(active.done){done=true;break;}
 }
 const delayed=await page.evaluate(()=>window.fxCheckDelayed);
 results.push({scene,done,frames,delayed,errors});writeFileSync('docs/screenshots/fx-phone/1-corner-check.json',JSON.stringify(results,null,2)+'\n');
 expect(errors).toEqual([]);expect(frames.every(f=>f.changed===0),'no misplaced FX paint in corner (excluding intentional full-board flash)').toBe(true);expect(done,'complete scene').toBe(true);
 expect(delayed.filter(a=>a.fill==='both').length).toBeGreaterThan(0);
 console.log(JSON.stringify({scene,frames:frames.length,delayed:delayed.length,cornerPixelsWithoutIntendedFlash:0,done}));await page.close();
}}finally{await browser.close();await server.close()}
