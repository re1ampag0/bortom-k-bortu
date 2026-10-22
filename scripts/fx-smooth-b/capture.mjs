// Deterministic art comparison, independent of the performance run. Native keyframes, controlled clip clock.
import {preview} from 'vite';import{chromium,expect}from'@playwright/test';import{readFileSync,writeFileSync}from'node:fs';
const label=process.argv[2]??'after',scene=process.argv[3]??'armada',laptop=process.argv.includes('--laptop'),width=laptop?1920:430,height=laptop?944:932,phase=Number(process.argv.find(a=>a.startsWith('--phase='))?.split('=')[1]??100),stem=`${scene}-${laptop?'laptop':'phone'}-${phase}`;
const server=await preview({build:{outDir:label==='before'?'tmp/fx-smooth-b/before-dist':'tmp/fx-smooth-b/after-dist'},preview:{host:'127.0.0.1',port:5288,strictPort:true}});const browser=await chromium.launch({executablePath:'/usr/bin/chromium'});
try{
 const p=await browser.newPage({viewport:{width,height},deviceScaleFactor:laptop?1:3}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.clock.install({time:new Date(0)});await p.clock.pauseAt(new Date(1));
 await p.addInitScript(()=>{
  let seed=19427;Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);window.spriteAnimations=[];
  const controlled=new WeakSet(),playState=Object.getOwnPropertyDescriptor(Animation.prototype,'playState').get;
  Object.defineProperty(Animation.prototype,'playState',{configurable:true,get(){const state=playState.call(this);return state==='paused'&&controlled.has(this)?'running':state}});
  const native=Element.prototype.animate;Element.prototype.animate=function(frames,options){const animation=native.call(this,frames,options);animation.pause();controlled.add(animation);animation.currentTime=0;window.spriteAnimations.push({animation,at:performance.now()});return animation};
 });
 await p.goto(`http://127.0.0.1:5288/bortom-k-bortu/?fxScene=${scene}&manual=1&speed=normal&perf=0`);await p.evaluate(()=>document.fonts.ready);await p.getByTestId('fx-start').click();
 let first=null,captured=false;
 for(let t=20;t<=25000;t+=20){
  await p.clock.runFor(20);await p.evaluate(()=>{
   const now=performance.now();for(const row of window.spriteAnimations){const a=row.animation;if(a.playState==='idle'||a.playState==='finished')continue;const dt=now-row.at,end=a.effect.getComputedTiming().endTime;if(dt>=end)a.finish();else a.currentTime=Math.max(0,dt)}
   for(const a of document.getAnimations())if(a instanceof CSSAnimation){a.pause();a.currentTime=0}
  });
  if(first===null&&(scene==='counter'?await p.locator('.fx-layer > .tag').filter({hasText:'Ответ:'}).count():await p.locator(scene==='bottle'?'.lg-card':'.gun-fire').count())){first=t;await p.evaluate(()=>document.fonts.ready)}
  if(first!==null&&t>=first+phase){
   await p.screenshot({path:`docs/screenshots/fx-smooth-b/${stem}-${label}.png`});
   const meta=await p.evaluate(()=>({veilOpacity:document.querySelector('.lg-veil')?Number(getComputedStyle(document.querySelector('.lg-veil')).opacity):null,ships:document.querySelectorAll('.lg-pitch').length,shots:document.querySelectorAll('.gun-fire').length,sprites:document.querySelectorAll('.fx-sprite').length,canvas:document.querySelector('.fx-layer')?.parentElement?.fxParticles?.()}));
   writeFileSync(`docs/screenshots/fx-smooth-b/${stem}-${label}-frame.json`,JSON.stringify({first,t,...meta,errors},null,2));if(scene==='armada'){expect(meta.ships).toBe(laptop?6:4);expect(meta.veilOpacity,'the entrance veil has gone').toBe(0);}captured=true;break;
  }
 }
 if(!captured)console.log('CAPTURE_ERROR',JSON.stringify({errors,state:await p.evaluate(()=>({hidden:document.hidden,done:document.body.dataset.fxDone,trace:localStorage.getItem('bortom-fx-trace')}))}));
 expect(captured).toBe(true);expect(errors).toEqual([]);expect(await p.evaluate(()=>JSON.parse(localStorage.getItem('bortom-fx-trace')??'[]').filter(line=>line.includes('✗')))).toEqual([]);
 if(label==='after'){
  await p.setViewportSize({width:width*2,height:height+40});await p.setContent(`<style>body{margin:0;display:flex;background:#291d13;color:#f8e7c8;font:18px sans-serif}figure{margin:0}figcaption{height:40px;text-align:center}img{display:block;width:${width}px;height:${height}px}</style>`+['before','after'].map(k=>`<figure><figcaption>${k==='before'?'До':'После'}</figcaption><img src="data:image/png;base64,${readFileSync(`docs/screenshots/fx-smooth-b/${stem}-${k}.png`).toString('base64')}"></figure>`).join(''));await p.screenshot({path:`docs/screenshots/fx-smooth-b/${stem}-comparison.png`});
 }
 console.log('CAPTURE_OK',label);
}finally{await browser.close();await new Promise(r=>server.httpServer.close(r))}
